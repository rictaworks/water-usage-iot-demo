class AddTemperatureToFlowReadings < ActiveRecord::Migration[8.1]
  def change
    add_column :flow_readings, :temperature, :float
  end
end
