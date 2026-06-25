module Api
  class DevicesController < BaseController
    def create
      return render json: { error: 'Forbidden' }, status: :forbidden if honeypot_triggered?

      sess = current_session
      return render json: { error: 'Session not found' }, status: :unauthorized unless sess

      device = sess.devices.build(
        device_token: params[:device_token],
        label: params[:label],
        is_virtual: params[:is_virtual] || false,
        online_at: Time.current
      )

      if device.save
        render json: { device_id: device.id, label: device.label, device_token: device.device_token }, status: :created
      else
        render json: { errors: device.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def pump
      sess = current_session
      return render json: { error: 'Session not found' }, status: :unauthorized unless sess

      device = sess.devices.find_by(id: params[:id])
      return render json: { error: 'Device not found' }, status: :not_found unless device

      device.update!(pump_on: ActiveModel::Type::Boolean.new.cast(params[:pump_on]))
      render json: { pump_on: device.pump_on }
    end
  end
end
