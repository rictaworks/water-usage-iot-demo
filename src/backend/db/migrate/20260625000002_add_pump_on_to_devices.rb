class AddPumpOnToDevices < ActiveRecord::Migration[8.1]
  def change
    add_column :devices, :pump_on, :boolean, default: false, null: false
  end
end
