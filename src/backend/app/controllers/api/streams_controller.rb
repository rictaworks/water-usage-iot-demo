module Api
  class StreamsController < BaseController
    include ActionController::Live

    HEARTBEAT_INTERVAL = 15
    DATA_PUSH_INTERVAL = 30

    def show
      response.headers['Content-Type'] = 'text/event-stream'
      response.headers['Cache-Control'] = 'no-cache'
      response.headers['X-Accel-Buffering'] = 'no'

      sess = current_session
      unless sess
        response.stream.write("event: error\ndata: {\"error\":\"Session not found\"}\n\n")
        return
      ensure
        response.stream.close
      end

      last_data_push = Time.current

      begin
        loop do
          now = Time.current

          if now - last_data_push >= DATA_PUSH_INTERVAL
            push_session_data(response.stream, sess)
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
    end

    private

    def push_session_data(stream, sess)
      devices = sess.devices.includes(:flow_readings, :daily_summary, :alerts)
      payload = devices.map do |device|
        latest_reading = device.flow_readings.order(:received_at).last
        {
          device_id: device.id,
          label: device.label,
          is_virtual: device.is_virtual,
          flow_rate: latest_reading&.flow_rate || 0.0,
          total_liters: device.daily_summary&.total_liters || 0.0,
          alerts: device.alerts.order(created_at: :desc).limit(5).map { |a|
            { rule_id: a.rule_id, message: a.message, severity: a.severity }
          }
        }
      end
      stream.write("data: #{payload.to_json}\n\n")
    end
  end
end
