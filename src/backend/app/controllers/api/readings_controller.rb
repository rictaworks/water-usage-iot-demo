module Api
  class ReadingsController < BaseController
    def create
      return render json: { error: 'Forbidden' }, status: :forbidden if honeypot_triggered?

      device = Device.find_by(device_token: params[:device_token])
      return render json: { error: 'Device not found' }, status: :not_found unless device

      received_at_sec = params[:sent_at_sec]&.to_i || Time.current.to_i

      reading = device.flow_readings.build(
        flow_rate: params[:flow_rate].to_f,
        volume_delta: params[:volume_delta].to_f,
        received_at: Time.at(received_at_sec).utc,
        received_at_sec: received_at_sec
      )

      begin
        reading.save!
      rescue ActiveRecord::RecordNotUnique
        return render json: { status: 'duplicate', skipped: true }
      end

      update_daily_summary(device, reading.volume_delta)

      alerts = AnomalyDetector.new.call(device, reading)
      alerts.each do |alert_data|
        device.alerts.create!(alert_data)
      end

      led_state = LedController.new.call(alerts, reading.flow_rate)

      render json: {
        reading_id: reading.id,
        alerts: alerts,
        led_state: led_state
      }, status: :created
    end

    private

    def update_daily_summary(device, volume_delta)
      today = Date.current
      summary = device.daily_summary

      if summary
        summary.with_lock do
          summary.total_liters += volume_delta
          summary.date_jst = today
          summary.updated_at = Time.current
          summary.save!
        end
      else
        begin
          device.create_daily_summary!(
            total_liters: volume_delta,
            date_jst: today,
            updated_at: Time.current
          )
        rescue ActiveRecord::RecordNotUnique
          retry
        end
      end
    end
  end
end
