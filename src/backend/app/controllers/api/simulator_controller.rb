module Api
  class SimulatorController < BaseController
    def status
      sess = current_session
      return render json: { error: 'Session not found' }, status: :unauthorized unless sess

      running = VirtualSimulator.running?(sess.id)
      render json: { running: running, scenario: nil }
    end

    def start
      sess = current_session
      return render json: { error: 'Session not found' }, status: :unauthorized unless sess

      scenario_name = params[:scenario].to_s
      VirtualSimulator.start(scenario_name, sess.id)
      render json: { status: 'started', scenario: scenario_name }
    rescue ArgumentError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def stop
      sess = current_session
      return render json: { error: 'Session not found' }, status: :unauthorized unless sess

      VirtualSimulator.stop(sess.id)
      render json: { status: 'stopped' }
    end
  end
end
