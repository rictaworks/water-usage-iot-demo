class CreateDevices < ActiveRecord::Migration[8.1]
  def change
    create_table :devices, id: false do |t|
      t.string :id, primary_key: true, null: false
      t.string :session_id
      t.string :device_token
      t.string :label
      t.boolean :is_virtual, default: false
      t.datetime :online_at
      t.datetime :created_at
    end

    add_index :devices, :device_token, unique: true
    add_index :devices, :session_id
  end
end
