FROM ruby:2.3.3-slim

RUN echo "deb http://archive.debian.org/debian/ jessie main" > /etc/apt/sources.list && \
    echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/10no-check-valid-until && \
    apt-get update -o Acquire::AllowInsecureRepositories=true -o Acquire::AllowDowngradeToInsecureRepositories=true || true && \
    apt-get install -y --force-yes \
    build-essential \
    libpq-dev \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV LANG=C.UTF-8

COPY Gemfile Gemfile.lock ./
RUN gem install bundler -v 1.15.3 && bundle install --jobs 4 --retry 3

COPY . ./

EXPOSE 4567

CMD ["bundle", "exec", "puma", "-p", "4567", "-e", "development"]
