class AnomalyDetector
  CONTINUOUS_FLOW_THRESHOLD = 0.1
  CONTINUOUS_FLOW_MINUTES = 30
  HIGH_FLOW_THRESHOLD = 20.0
  DAILY_USAGE_NORMAL_LIMIT = 200.0
  DAILY_USAGE_FACILITY_LIMIT = 1000.0
  LATE_NIGHT_FLOW_THRESHOLD = 0.5
  LATE_NIGHT_START_HOUR = 2
  LATE_NIGHT_END_HOUR = 5

  def call(device, flow_reading)
    alerts = []
    alerts += check_continuous_flow(device, flow_reading)
    alerts += check_high_flow(flow_reading)
    alerts += check_daily_usage(device)
    alerts += check_late_night_flow(flow_reading)
    alerts
  end

  private

  # Detects if flow has been ongoing for at least CONTINUOUS_FLOW_MINUTES.
  # Looks for any reading older than the threshold window; if one exists with
  # flow above threshold, and the current reading also has flow, the condition is met.
  def check_continuous_flow(device, flow_reading)
    return [] unless flow_reading.flow_rate > CONTINUOUS_FLOW_THRESHOLD

    cutoff = CONTINUOUS_FLOW_MINUTES.minutes.ago
    oldest_in_window = device.flow_readings
                             .where('flow_rate > ?', CONTINUOUS_FLOW_THRESHOLD)
                             .order(:received_at)
                             .first

    return [] unless oldest_in_window
    return [] unless oldest_in_window.received_at <= cutoff

    [{ rule_id: 'R01', message: '30分以上継続して水が流れています', severity: 'warning' }]
  end

  def check_high_flow(flow_reading)
    return [] unless flow_reading.flow_rate >= HIGH_FLOW_THRESHOLD

    [{ rule_id: 'R02', message: '瞬間流量が異常に高い値です', severity: 'warning' }]
  end

  def check_daily_usage(device)
    summary = device.daily_summary
    return [] unless summary

    limit = device.session.facility_mode ? DAILY_USAGE_FACILITY_LIMIT : DAILY_USAGE_NORMAL_LIMIT
    return [] unless summary.total_liters > limit

    [{ rule_id: 'R03', message: '本日の使用量が上限を超えました', severity: 'caution' }]
  end

  def check_late_night_flow(flow_reading)
    hour_jst = flow_reading.received_at.in_time_zone('Tokyo').hour
    in_late_night = hour_jst >= LATE_NIGHT_START_HOUR && hour_jst < LATE_NIGHT_END_HOUR
    return [] unless in_late_night && flow_reading.flow_rate > LATE_NIGHT_FLOW_THRESHOLD

    [{ rule_id: 'R04', message: '深夜時間帯（2〜5時）に水が流れています', severity: 'warning' }]
  end
end
