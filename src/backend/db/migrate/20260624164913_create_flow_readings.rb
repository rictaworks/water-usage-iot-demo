class CreateFlowReadings < ActiveRecord::Migration[8.1]
  def change
    create_table :flow_readings, id: false do |t|
      t.string :id, primary_key: true, null: false
      t.string :device_id
      t.float :flow_rate
      t.float :volume_delta
      t.datetime :received_at
      t.integer :received_at_sec
    end

    add_index :flow_readings, [:device_id, :received_at_sec], unique: true
    add_index :flow_readings, :device_id
  end
end
