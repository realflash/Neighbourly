require 'sinatra/base'

module Sinatra
  module ViewHelper
    module Helpers
      def body_class(body)
        body ? body : nil
      end

      def campaigns
        [
          'If applicable, select campaign before claiming',
          'Dickson',
          'Warringah',
        ]
      end

      def templates
        [
          {value: '', label: 'If applicable, select template type before claiming'},
          {value: 'hidden', label: 'Hide knocked doors'},
          {value: 'previous_results', label: 'Show previous results'},
        ]
      end

      def versioned_stylesheet(stylesheet)
        to("/stylesheets/#{stylesheet}.css?") + File.mtime(File.join("public", "stylesheets", "#{stylesheet}.css")).to_i.to_s
      end

      def versioned_javascript(js)
        to("/javascript/#{js}.js?") + File.mtime(File.join("public", "javascript", "#{js}.js")).to_i.to_s
      end

      def is_admin?(email)
        if !ENV['ADMIN_EMAILS'].to_s.strip.empty?
          emails = ENV['ADMIN_EMAILS'].split(",").map(&:strip).map(&:downcase)
          emails.include?(email.to_s.downcase)
        else
          false
        end
      end
    end

    def self.registered(app)
      app.helpers ViewHelper::Helpers
    end
  end

  register ViewHelper
end
