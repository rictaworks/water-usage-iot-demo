class FlowReading < ApplicationRecord
  self.primary_key = 'id'
  belongs_to :device

  before_create { self.id ||= SecureRandom.uuid }
  after_create :upsert_daily_summary

  validates :device_id, :flow_rate, :received_at, presence: true

  private

  def upsert_daily_summary
    today = Date.current
    summary = device.daily_summary
    if summary
      summary.with_lock do
        summary.total_liters += volume_delta.to_f
        summary.date_jst = today
        summary.save!
      end
    else
      begin
        device.create_daily_summary!(total_liters: volume_delta.to_f, date_jst: today)
      rescue ActiveRecord::RecordNotUnique
        retry
      end
    end
  end
end
