class Session < ApplicationRecord
  self.primary_key = 'id'
  has_many :devices, foreign_key: :session_id

  before_create do
    self.id ||= SecureRandom.uuid
    self.expires_at ||= 24.hours.from_now
  end
end
