class VirtualSimulator
  @threads = {}
  @stop_flags = {}
  @mutex = Mutex.new

  class << self
    def start(scenario_name, session_id)
      preset = ScenarioPreset.find_by(name: scenario_name)
      raise ArgumentError, "Unknown scenario: #{scenario_name}" unless preset

      stop(session_id)

      pattern = JSON.parse(preset.pattern_json)
      stop_flag = { stopped: false }

      @mutex.synchronize { @stop_flags[session_id] = stop_flag }

      thread = Thread.new do
        run_scenario(pattern, session_id, stop_flag)
      end

      @mutex.synchronize { @threads[session_id] = thread }
    end

    def running?(session_id)
      @mutex.synchronize { @threads[session_id]&.alive? || false }
    end

    def stop(session_id)
      @mutex.synchronize do
        flag = @stop_flags[session_id]
        flag[:stopped] = true if flag
        @stop_flags.delete(session_id)
        @threads.delete(session_id)
      end
    end

    private

    def run_scenario(pattern, session_id, stop_flag)
      interval = pattern['interval_sec'] || 5
      tick = 0

      until stop_flag[:stopped]
        flow_rate = calculate_flow_rate(pattern, tick)
        persist_reading(session_id, flow_rate)
        tick += 1
        sleep(interval)
      end
    rescue StandardError => e
      Rails.logger.error("VirtualSimulator error for session #{session_id}: #{e.message}")
    end

    def calculate_flow_rate(pattern, tick)
      case pattern['type']
      when 'normal'
        min_rate = pattern['min'].to_f
        max_rate = pattern['max'].to_f
        min_rate + rand * (max_rate - min_rate)
      when 'leak'
        pattern['flow_rate'].to_f
      when 'peak'
        spike_every = pattern['spike_every'].to_i
        (tick % spike_every).zero? ? pattern['spike'].to_f : pattern['base'].to_f
      else
        0.0
      end
    end

    def persist_reading(session_id, flow_rate)
      session = Session.find_by(id: session_id)
      return unless session

      virtual_device = session.devices.find_by(is_virtual: true)
      return unless virtual_device

      now = Time.current
      virtual_device.update_column(:online_at, now)
      reading = FlowReading.create!(
        device_id: virtual_device.id,
        flow_rate: flow_rate,
        volume_delta: flow_rate / 12.0,
        received_at: now,
        received_at_sec: now.to_i
      )

      alerts = AnomalyDetector.new.call(virtual_device, reading)
      alerts.each do |alert_data|
        virtual_device.alerts.create!(alert_data)
      end
    rescue ActiveRecord::RecordNotUnique
      # Idempotency: duplicate timestamp, skip
    end
  end
end
