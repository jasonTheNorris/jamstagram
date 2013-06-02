require 'data_mapper'

class User
  include DataMapper::Resource

  property :id, Serial
  property :name, String

  has n, :jamstagrams
end

class Jamstagram
  include DataMapper::Resource

  property :id, Serial
  property :src, String
  property :title, String

  belongs_to :user
end

DataMapper.setup(:default, ENV['DATABASE_URL'] || 'postgres://postgres:postgres@localhost/jamstagram')
DataMapper.finalize.auto_upgrade!