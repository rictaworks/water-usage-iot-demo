class CreateDailySummaries < ActiveRecord::Migration[8.1]
  def change
    create_table :daily_summaries, id: false do |t|
      t.string :id, primary_key: true, null: false
      t.string :device_id
      t.float :total_liters, default: 0.0
      t.date :date_jst
      t.datetime :updated_at
    end

    add_index :daily_summaries, :device_id, unique: true
  end
end
