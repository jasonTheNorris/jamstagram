require 'rubygems'
require 'debugger'
require 'sinatra'
require 'json'
require 'rdio'
require './models/models'

get '/api/templates' do
  content_type :json
  templates = {}
  Dir.glob(File.join('public', 'templates', '*.html')) do |path|
    templates[File.basename(path, '.html')] = File.read(path)
  end
  templates.to_json
end

post '/api/jamstagram' do
  debugger
end

get '/api/jamstagrams' do
  content_type :json
  jamstagrams = [{
    src: '/img/ig_01.jpg',
    title: 'Aerials',
    creator: 'Jason Russell'
  }, {
    src: '/img/ig_02.jpg',
    title: 'We Can Be Heroes',
    creator: 'Jessica Jarvis'
  }, {
    src: '/img/ig_03.jpg',
    title: 'I Am a Ghost',
    creator: 'Malthe Sigurdsson'
  }, {
    src: '/img/ig_04.jpg',
    title: 'The Vinyl Countdown',
    creator: 'Jason Norris'
  }, {
    src: '/img/ig_05.jpg',
    title: 'Find Greatness',
    creator: 'Rod Naber'
  }, {
    src: '/img/ig_06.jpg',
    title: 'Hope Floats',
    creator: 'Netta Marshall'
  }, {
    src: '/img/ig_07.jpg',
    title: 'Meet Me in Montauk',
    creator: 'Ryan Sims'
  }, {
    src: '/img/ig_08.jpg',
    title: 'Kick It.',
    creator: 'Bex Finch'
  }, {
    src: '/img/ig_09.jpg',
    title: 'I.C.U.',
    creator: 'Chris Becherer'
  }, {
    src: '/img/ig_10.jpg',
    title: 'Underwater',
    creator: 'Mary van Ogtrop'
  }, {
    src: '/img/ig_11.jpg',
    title: 'Friday Night Lights',
    creator: 'Jason Russell'
  }, {
    src: '/img/ig_12.jpg',
    title: 'I Wanna Rock With You',
    creator: 'Brad Smith'
  }];
  jamstagrams.to_json
end

get '/' do
  File.read(File.join('public', 'app.html'))
end

get '/create' do
  File.read(File.join('public', 'app.html'))
end

get '/p/:id' do
  File.read(File.join('public', 'app.html'))
end

get '/api/p/:id' do
  content_type :json
  jamstagram = {
    src: 'http://distilleryimage5.s3.amazonaws.com/d44d7652ac4311e2875a22000aaa0594_7.jpg',
    title: 'Emo Night',
    creator: 'Jason Norris',
    tracks: [
      "t2276276",
      "t2491084",
      "t3370025",
      "t1180038",
      "t1786234"
    ]
  };
  jamstagram.to_json
end
