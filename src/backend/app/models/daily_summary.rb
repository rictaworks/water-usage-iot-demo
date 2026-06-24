class DailySummary < ApplicationRecord
  self.primary_key = 'id'
  belongs_to :device

  before_create { self.id ||= SecureRandom.uuid }
end
