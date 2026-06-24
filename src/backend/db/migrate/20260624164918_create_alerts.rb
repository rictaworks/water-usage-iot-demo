class CreateAlerts < ActiveRecord::Migration[8.1]
  def change
    create_table :alerts, id: false do |t|
      t.string :id, primary_key: true, null: false
      t.string :device_id
      t.string :rule_id
      t.string :message
      t.string :severity
      t.datetime :created_at
    end

    add_index :alerts, :device_id
  end
end
