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
        temperature: params[:temperature]&.to_f,
        received_at: Time.at(received_at_sec).utc,
        received_at_sec: received_at_sec
      )

      begin
        reading.save!
      rescue ActiveRecord::RecordNotUnique
        return render json: { status: 'duplicate', skipped: true }
      end

      alerts = AnomalyDetector.new.call(device, reading)
      alerts.each do |alert_data|
        device.alerts.create!(alert_data)
      end

      led_state = LedController.new.call(alerts, reading.flow_rate)

      device.update_column(:online_at, Time.current)

      render json: {
        reading_id: reading.id,
        alerts: alerts,
        led_state: led_state,
        pump_on: device.pump_on
      }, status: :created
    end

  end
end
