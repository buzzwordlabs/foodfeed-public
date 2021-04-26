import { Text, AppStoreButton } from '../../components';
import { Card, Col, Container, Row } from 'react-bootstrap';

import React from 'react';
import css from './Home.module.css';
import { tintColor } from '../../constants';
import ImageGallery, { ReactImageGalleryItem } from 'react-image-gallery';
import Emoji from 'a11y-react-emoji';

const watch = 'https://i.imgur.com/DFqyHGI.png';
const watchCropped = 'https://i.imgur.com/7oep0OH.png';
const find = 'https://i.imgur.com/U9ivyMF.png';
const post = 'https://i.imgur.com/a3lQ2tg.png';
const postCropped = 'https://i.imgur.com/mmloTLe.png';
const makeFriends = 'https://i.imgur.com/VGd3gG9.png';
const makeFriendsCropped = 'https://i.imgur.com/be0EkGj.png';
const startStream = 'https://i.imgur.com/O3NNyHz.png';
const startStreamCropped = 'https://i.imgur.com/qr9aIcC.png';
const buildFollowing = 'https://i.imgur.com/IgT2tF4.png';
const chat = 'https://i.imgur.com/TKrHzv5.png';
const build = 'https://i.imgur.com/93A83CK.png';

const images: ReactImageGalleryItem[] = [
  {
    original: watch,
    thumbnail: watch
  },
  {
    original: find,
    thumbnail: find
  },
  {
    original: post,
    thumbnail: post
  },
  {
    original: build,
    thumbnail: build
  },
  {
    original: chat,
    thumbnail: chat
  },
  {
    original: makeFriends,
    thumbnail: makeFriends
  },
  {
    original: startStream,
    thumbnail: startStream
  },
  {
    original: buildFollowing,
    thumbnail: buildFollowing
  }
];

const smallDevice = window.innerWidth <= 760;

export default function Home(_props: any) {
  return (
    <>
      <Container fluid style={{ overflowX: 'hidden' }} className="px-0">
        <Hero />
        <div className={smallDevice ? 'px-2' : 'px-5'}>
          <hr className="mx-5" />
          <HowItWorks />
          <hr className="mx-5" />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '6rem 0'
            }}
          >
            <Text s="h2" a="center">
              Get it for free, now!
            </Text>
            <Text s="h5" a="center">
              Download it on iOS and Android.
            </Text>
            <div style={{ marginTop: '3rem', marginBottom: '3rem' }}>
              <AppStoreButton
                platform="android"
                anchorProps={{ className: 'mx-2' }}
              />
              <AppStoreButton
                platform="ios"
                anchorProps={{ className: 'mx-2' }}
              />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

const Hero = () => (
  <Row className="mt-3 mb-5 mx-0 px-0" noGutters>
    <Col xs={12} md={6} className={smallDevice ? 'px-3' : 'px-5'}>
      <h1 className="mt-0 font-weight-bold" style={{ color: tintColor }}>
        Social Media For Foodies <Emoji symbol="😋" label="yum" />
      </h1>
      <br />
      <h3>
        FoodFeed lets you share your food experiences with anyone around the
        world.
      </h3>

      <ul style={{ marginTop: '1rem' }}>
        <li>
          Watch live streams of people eating and cooking food{' '}
          <Emoji symbol="📺" label="tv" />
          <Emoji symbol="🍿" label="popcorn" />
        </li>
        <li>
          Remotely share a meal with new people from all around the world{' '}
          <Emoji symbol="📱" label="smartphone" />
          <Emoji symbol="🌐" label="globe" />
        </li>
        <li>
          Start your own food-focused live stream and build a following{' '}
          <Emoji symbol="🎥" label="videocamera" />
          <Emoji symbol="🎬" label="clapperboard" />
        </li>
        <li>
          Post recipes and <Emoji symbol="🔥" label="fire" />
          food
        </li>
      </ul>

      <AppStoreButton
        platform="android"
        anchorProps={{ style: { marginRight: '1rem' } }}
      />
      <AppStoreButton platform="ios" />
      <br />
      <br />
      <br />
    </Col>
    <Col
      xs={12}
      md={6}
      style={{
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div className="mx-5">
        <ImageGallery items={images} showPlayButton={false} autoPlay />
      </div>
    </Col>
  </Row>
);

const HowItWorks = () => (
  <Row>
    <Col xs={12} className="text-center my-5">
      <h1>What can you do with FoodFeed?</h1>
    </Col>
    <Col xs={12} md={6}>
      <Card className={`mb-5 ${css.cardOverride}`}>
        <Card.Img
          variant="top"
          src={postCropped}
          className={`${css.imgOverride} my-4`}
          style={{ objectFit: 'contain', height: '30rem' }}
        />
        <Card.Body>
          <Text s="h2" style={{ fontWeight: 600 }}>
            <Emoji symbol="📷" label="camera" />{' '}
            <Emoji symbol="🍲" label="food" />
          </Text>
          <Text s="h2" style={{ fontWeight: 600 }}>
            Post About Food
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            Got a <Emoji symbol="🔥" label="fire" />
            recipe to share? Got some <Emoji symbol="😍" label="heart-eyes" />
            food pics?
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            Share it with the world!
          </Text>
        </Card.Body>
      </Card>
    </Col>
    <Col xs={12} md={6}>
      <Card className={`mb-5 ${css.cardOverride}`}>
        <Card.Img
          variant="top"
          src={makeFriendsCropped}
          className={`${css.imgOverride} my-4`}
          style={{ objectFit: 'contain', height: '30rem' }}
        />
        <Card.Body>
          <Text s="h2" style={{ fontWeight: 600 }}>
            <Emoji symbol="🍽️" label="plate" />{' '}
            <Emoji symbol="🧑‍🤝‍🧑" label="people" />
          </Text>
          <Text s="h2" style={{ fontWeight: 600 }}>
            Eat With New People
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            Eating alone?
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            We'll pair you up with another person via video call who's also
            looking for someone to eat with.
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            Make a new friend!
          </Text>
        </Card.Body>
      </Card>
    </Col>
    <Col xs={12} md={6}>
      <Card className={`mb-5 ${css.cardOverride}`}>
        <Card.Img
          variant="top"
          src={watchCropped}
          className={`${css.imgOverride} my-4`}
          style={{ objectFit: 'contain', height: '30rem' }}
        />
        <Card.Body>
          <Text s="h2" style={{ fontWeight: 600 }}>
            <Emoji symbol="📺" label="tv" />{' '}
            <Emoji symbol="🍿" label="popcorn" />
          </Text>
          <Text s="h2" style={{ fontWeight: 600 }}>
            Watch Live Streamers
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            Would rather be part of an audience?
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            Join live streams of other people eating food and be part of the
            conversation!
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            Keyword:{' '}
            <a href="https://en.wikipedia.org/wiki/Mukbang" target="blank">
              Mukbang
            </a>
            .
          </Text>
        </Card.Body>
      </Card>
    </Col>
    <Col xs={12} md={6}>
      <Card className={`mb-5 ${css.cardOverride}`}>
        <Card.Img
          variant="top"
          src={startStreamCropped}
          className={`${css.imgOverride} my-4`}
          style={{ objectFit: 'contain', height: '30rem' }}
        />
        <Card.Body>
          <Text s="h2" style={{ fontWeight: 600 }}>
            <Emoji symbol="🎥" label="videocamera" />{' '}
            <Emoji symbol="🎬" label="clapperboard" />
          </Text>
          <Text s="h2" style={{ fontWeight: 600 }}>
            Stream Yourself
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            Want to share your meal with the world?
          </Text>
          <Text s="p" w={500} style={{ fontSize: '1.1rem' }}>
            You can start your own stream, build an audience, and connect with
            even more people around the world.
          </Text>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);
