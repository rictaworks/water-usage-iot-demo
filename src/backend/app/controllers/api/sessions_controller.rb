module Api
  class SessionsController < BaseController
    def show
      sess = current_session

      unless sess
        sess = Session.create!
        cookies.permanent[:session_id] = {
          value: sess.id,
          httponly: true,
          same_site: :lax,
          secure: Rails.env.production?
        }
      end

      render json: {
        session_id: sess.id,
        facility_mode: sess.facility_mode,
        expires_at: sess.expires_at
      }
    end
  end
end
