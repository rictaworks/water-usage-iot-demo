/*
 * water_sensor.ino
 *
 * ESP32 (Freenove WROOM) + DHT11 + Relay fan
 * GPIO27: DHT11 DATA
 * GPIO26: Relay (fan / pump substitute)
 *
 * DHT11 humidity (0-100%) maps to flow_rate (0-10 L/min).
 * DHT11 temperature is sent as water temperature.
 * Backend response pump_on drives the relay.
 *
 * Copy secrets.h.example -> secrets.h and fill in your values.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <time.h>
#include "secrets.h"

#define DHT_PIN        27
#define DHT_TYPE       DHT11
#define RELAY_PIN      26
#define READ_INTERVAL  5000   // ms

DHT dht(DHT_PIN, DHT_TYPE);

static bool pumpState = false;

void setupWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected: " + WiFi.localIP().toString());
}

void setupNTP() {
  configTime(9 * 3600, 0, "pool.ntp.org", "time.google.com");
  struct tm ti;
  Serial.print("NTP syncing");
  while (!getLocalTime(&ti)) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nTime synced");
}

void setRelay(bool on) {
  pumpState = on;
  digitalWrite(RELAY_PIN, on ? HIGH : LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  setRelay(false);
  dht.begin();
  setupWiFi();
  setupNTP();
}

void loop() {
  static unsigned long lastRead = 0;
  unsigned long now = millis();
  if (now - lastRead < READ_INTERVAL) return;
  lastRead = now;

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost, reconnecting...");
    setupWiFi();
    return;
  }

  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT11 read error");
    return;
  }

  // humidity (0-100%) -> flow_rate (0-10 L/min)
  float flowRate    = humidity / 10.0f;
  // 5s interval = 5/60 min; volume = flow_rate * time_min
  float volumeDelta = flowRate * (READ_INTERVAL / 1000.0f / 60.0f);

  time_t sentAt = time(nullptr);

  Serial.printf("[%lld] Temp: %.1f°C  Hum: %.1f%%  Flow: %.2f L/min\n",
                (long long)sentAt, temperature, humidity, flowRate);

  HTTPClient http;
  http.begin(String(SERVER_URL) + "/api/readings");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> req;
  req["device_token"]  = DEVICE_TOKEN;
  req["flow_rate"]     = flowRate;
  req["temperature"]   = temperature;
  req["volume_delta"]  = volumeDelta;
  req["sent_at_sec"]   = (long)sentAt;

  String body;
  serializeJson(req, body);

  int statusCode = http.POST(body);
  if (statusCode == 201) {
    String respStr = http.getString();
    StaticJsonDocument<256> res;
    if (deserializeJson(res, respStr) == DeserializationError::Ok) {
      bool newPumpState = res["pump_on"] | false;
      if (newPumpState != pumpState) {
        setRelay(newPumpState);
        Serial.printf("Pump -> %s\n", newPumpState ? "ON" : "OFF");
      }
    }
  } else {
    Serial.printf("POST failed: %d\n", statusCode);
  }

  http.end();
}
