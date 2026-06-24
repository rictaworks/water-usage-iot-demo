class CreateSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions, id: false do |t|
      t.string :id, primary_key: true, null: false
      t.boolean :facility_mode, default: false
      t.datetime :created_at
      t.datetime :expires_at
    end
  end
end
