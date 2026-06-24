class DailyResetJob < ApplicationJob
  queue_as :default

  TABLES_TO_RESET = %w[alerts flow_readings daily_summaries devices sessions scenario_presets].freeze

  def perform
    ActiveRecord::Base.transaction do
      TABLES_TO_RESET.each do |table|
        ActiveRecord::Base.connection.execute("DELETE FROM #{table}")
      end
      ActiveRecord::Base.connection.execute('VACUUM')
    end
    ScenarioPreset.create!([
      { name: 'normal', description: '通常使用（1〜3 L/min 周期変動）', pattern_json: { type: 'normal', min: 1.0, max: 3.0, interval_sec: 5 }.to_json },
      { name: 'leak', description: '漏水シナリオ（0.2 L/min を30分以上継続）', pattern_json: { type: 'leak', flow_rate: 0.2, duration_min: 35, interval_sec: 5 }.to_json },
      { name: 'peak', description: '大流量（20 L/min 以上のスパイク）', pattern_json: { type: 'peak', base: 2.0, spike: 25.0, spike_every: 10, interval_sec: 5 }.to_json }
    ])
  end
end
