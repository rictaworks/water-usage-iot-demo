class Device < ApplicationRecord
  self.primary_key = 'id'
  belongs_to :session
  has_many :flow_readings
  has_one :daily_summary
  has_many :alerts

  before_create { self.id ||= SecureRandom.uuid }

  validates :device_token, presence: true, uniqueness: true
end
