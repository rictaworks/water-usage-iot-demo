module Api
  class AdminController < BaseController
    before_action :authenticate_admin!

    def daily_reset
      DailyResetJob.perform_later
      render json: { status: 'scheduled' }
    end

    private

    def authenticate_admin!
      token = request.headers['Authorization']&.sub('Bearer ', '')
      expected = ENV.fetch('ADMIN_RESET_TOKEN', nil)
      return if expected.present? && token == expected

      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end
end
