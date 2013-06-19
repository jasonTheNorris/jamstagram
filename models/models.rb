require 'data_mapper'

class User
  include DataMapper::Resource

  property :id, Serial

  has n, :jamstagrams
end

class Jamstagram
  include DataMapper::Resource

  property :id, Serial
  property :photo_id, Integer
  property :playlist_key, String

  belongs_to :user
end

DataMapper.setup(:default, ENV['DATABASE_URL'] || 'postgres://postgres:postgres@localhost/jamstagram')
DataMapper.finalize.auto_upgrade!