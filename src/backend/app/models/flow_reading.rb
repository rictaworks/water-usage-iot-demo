class FlowReading < ApplicationRecord
  self.primary_key = 'id'
  belongs_to :device

  before_create { self.id ||= SecureRandom.uuid }

  validates :device_id, :flow_rate, :received_at, presence: true
end
