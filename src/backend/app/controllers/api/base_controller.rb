module Api
  class BaseController < ApplicationController
    private

    def current_session
      session_id = request.headers['X-Session-Id'].presence ||
                   params[:session_id].presence ||
                   cookies[:session_id]
      return nil unless session_id

      @current_session ||= Session.find_by(id: session_id, expires_at: Time.current..)
    end

    def honeypot_triggered?
      params[:hp_field].present?
    end
  end
end
