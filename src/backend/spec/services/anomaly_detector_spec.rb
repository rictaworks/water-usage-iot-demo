require 'rails_helper'

RSpec.describe AnomalyDetector do
  let(:session) { Session.create! }
  let(:device) { session.devices.create!(device_token: 'ANOM01', label: 'Test') }
  let(:detector) { described_class.new }

  def make_reading(flow_rate:, received_at: Time.current, received_at_sec: nil)
    FlowReading.new(
      device_id: device.id,
      flow_rate: flow_rate,
      volume_delta: 0.1,
      received_at: received_at,
      received_at_sec: received_at_sec || received_at.to_i
    )
  end

  describe 'R01: continuous flow' do
    it 'detects flow continuous for 30+ minutes' do
      35.times do |i|
        FlowReading.create!(
          device_id: device.id,
          flow_rate: 0.5,
          volume_delta: 0.1,
          received_at: (35 - i).minutes.ago,
          received_at_sec: (35 - i).minutes.ago.to_i + i
        )
      end

      reading = make_reading(flow_rate: 0.5, received_at: Time.current, received_at_sec: Time.current.to_i + 1000)
      alerts = detector.call(device, reading)
      expect(alerts.map { |a| a[:rule_id] }).to include('R01')
    end

    it 'does not flag short duration flow' do
      reading = make_reading(flow_rate: 0.5)
      alerts = detector.call(device, reading)
      expect(alerts.map { |a| a[:rule_id] }).not_to include('R01')
    end
  end

  describe 'R02: high flow' do
    it 'detects flow_rate >= 20.0' do
      reading = make_reading(flow_rate: 25.0)
      alerts = detector.call(device, reading)
      expect(alerts.map { |a| a[:rule_id] }).to include('R02')
    end

    it 'does not flag flow_rate < 20.0' do
      reading = make_reading(flow_rate: 5.0)
      alerts = detector.call(device, reading)
      expect(alerts.map { |a| a[:rule_id] }).not_to include('R02')
    end
  end

  describe 'R03: daily usage exceeded' do
    it 'detects when total_liters exceed normal limit' do
      device.create_daily_summary!(total_liters: 250.0, date_jst: Date.current, updated_at: Time.current)
      reading = make_reading(flow_rate: 1.0)
      alerts = detector.call(device, reading)
      expect(alerts.map { |a| a[:rule_id] }).to include('R03')
    end
  end

  describe 'R04: late night flow' do
    it 'detects flow during 02:00-05:00 JST' do
      late_night = Time.zone.local(2026, 6, 24, 3, 0, 0)
      reading = make_reading(flow_rate: 1.0, received_at: late_night)
      alerts = detector.call(device, reading)
      expect(alerts.map { |a| a[:rule_id] }).to include('R04')
    end

    it 'does not flag normal hours' do
      daytime = Time.zone.local(2026, 6, 24, 10, 0, 0)
      reading = make_reading(flow_rate: 1.0, received_at: daytime)
      alerts = detector.call(device, reading)
      expect(alerts.map { |a| a[:rule_id] }).not_to include('R04')
    end
  end
end
