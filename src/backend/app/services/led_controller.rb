class LedController
  def call(alerts, current_flow_rate = 0.0)
    warning_rules = %w[R01 R02 R04]
    caution_rules = %w[R03]

    has_warning = alerts.any? { |a| warning_rules.include?(a[:rule_id] || a['rule_id']) }
    has_caution = alerts.any? { |a| caution_rules.include?(a[:rule_id] || a['rule_id']) }

    if has_warning
      { led_color: 'red', led_blink_hz: 4, fan_speed_pct: 100 }
    elsif has_caution
      { led_color: 'yellow', led_blink_hz: 1, fan_speed_pct: 60 }
    elsif current_flow_rate > 0
      { led_color: 'green', led_blink_hz: 0, fan_speed_pct: 30 }
    else
      { led_color: 'off', led_blink_hz: 0, fan_speed_pct: 0 }
    end
  end
end
