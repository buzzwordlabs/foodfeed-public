FoodFeed was a social media platform for foodies. We shut this down in April 2021 and decided to open-source it since this code wasn't doing anything on our computers.

https://www.producthunt.com/posts/foodfeed

Project is composed of:
1. janus-microservice - Janus is a WebRTC server to do server-side WebRTC (https://github.com/meetecho/janus-gateway). We had a microservice to do things like live streaming, as well as recording of streams if you so desired (we never shipped the recording feature, but it was built out).
2. mobile - React Native app
3. server - Node.js TypeScript app with PostgreSQL database (interfacing with https://jawj.github.io/zapatos/), no ORM
4. static - landing page
5. static-server - server for landing page, that was necessary for things like universal linking on mobile
