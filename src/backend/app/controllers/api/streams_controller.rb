module Api
  class StreamsController < BaseController
    include ActionController::Live

    HEARTBEAT_INTERVAL = 5
    DATA_PUSH_INTERVAL = 10

    def show
      response.headers['Content-Type'] = 'text/event-stream'
      response.headers['Cache-Control'] = 'no-cache'
      response.headers['X-Accel-Buffering'] = 'no'

      sess = current_session
      unless sess
        response.stream.write("event: error\ndata: {\"error\":\"Session not found\"}\n\n")
        return
      end

      last_data_push = Time.current
      pushed_alert_ids = {}

      loop do
        now = Time.current

        if now - last_data_push >= DATA_PUSH_INTERVAL
          push_session_data(response.stream, sess, pushed_alert_ids)
          last_data_push = now
        end

        response.stream.write(": heartbeat\n\n")
        sleep(HEARTBEAT_INTERVAL)
      end
    rescue ActionController::Live::ClientDisconnected, IOError
      # Client disconnected, close cleanly
    rescue StandardError => e
      Rails.logger.error("SSE stream error: #{e.message}")
    ensure
      response.stream.close
    end

    private

    def push_session_data(stream, sess, pushed_alert_ids)
      devices = sess.devices.includes(:daily_summary)
      total_liters = 0.0
      active_alerts_count = 0

      devices.each do |device|
        latest_reading = device.flow_readings.order(:received_at).last

        if latest_reading
          reading_event = {
            type: 'reading',
            data: {
              id: latest_reading.id,
              device_id: device.id,
              flow_rate: latest_reading.flow_rate,
              volume_total: device.daily_summary&.total_liters || 0.0,
              recorded_at: latest_reading.received_at.iso8601
            }
          }
          stream.write("data: #{reading_event.to_json}\n\n")
        end

        device_alerts = device.alerts.order(created_at: :desc).limit(20)
        active_alerts_count += device_alerts.count
        total_liters += device.daily_summary&.total_liters || 0.0

        device_alerts.reverse_each do |alert|
          next if pushed_alert_ids[alert.id]
          alert_event = {
            type: 'alert',
            data: {
              id: alert.id,
              device_id: device.id,
              rule_name: alert.rule_id,
              message: alert.message,
              severity: alert.severity,
              occurred_at: alert.created_at.iso8601
            }
          }
          stream.write("data: #{alert_event.to_json}\n\n")
          pushed_alert_ids[alert.id] = true
        end
      end

      summary_event = {
        type: 'summary',
        data: { today_usage: total_liters, active_alerts: active_alerts_count }
      }
      stream.write("data: #{summary_event.to_json}\n\n")
    end
  end
end
