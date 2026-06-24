require 'rails_helper'

RSpec.describe LedController do
  let(:controller) { described_class.new }

  it 'returns off state when no alerts and flow is 0' do
    result = controller.call([], 0.0)
    expect(result).to eq({ led_color: 'off', led_blink_hz: 0, fan_speed_pct: 0 })
  end

  it 'returns green when no alerts and flow > 0' do
    result = controller.call([], 1.5)
    expect(result).to eq({ led_color: 'green', led_blink_hz: 0, fan_speed_pct: 30 })
  end

  it 'returns yellow for R03 caution alert' do
    alerts = [{ rule_id: 'R03', severity: 'caution' }]
    result = controller.call(alerts, 1.0)
    expect(result).to eq({ led_color: 'yellow', led_blink_hz: 1, fan_speed_pct: 60 })
  end

  it 'returns red for R01 warning alert' do
    alerts = [{ rule_id: 'R01', severity: 'warning' }]
    result = controller.call(alerts, 0.5)
    expect(result).to eq({ led_color: 'red', led_blink_hz: 4, fan_speed_pct: 100 })
  end

  it 'returns red for R02 warning alert' do
    alerts = [{ rule_id: 'R02', severity: 'warning' }]
    result = controller.call(alerts, 25.0)
    expect(result).to eq({ led_color: 'red', led_blink_hz: 4, fan_speed_pct: 100 })
  end

  it 'returns red for R04 warning alert' do
    alerts = [{ rule_id: 'R04', severity: 'warning' }]
    result = controller.call(alerts, 1.0)
    expect(result).to eq({ led_color: 'red', led_blink_hz: 4, fan_speed_pct: 100 })
  end

  it 'warning takes precedence over caution' do
    alerts = [
      { rule_id: 'R03', severity: 'caution' },
      { rule_id: 'R01', severity: 'warning' }
    ]
    result = controller.call(alerts, 1.0)
    expect(result).to eq({ led_color: 'red', led_blink_hz: 4, fan_speed_pct: 100 })
  end
end
