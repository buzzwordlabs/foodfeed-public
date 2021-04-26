import React from 'react';
import { github, linkedin, twitter } from '../../assets/images';

const ethan = require('./ethan-profile-pic-2.jpg');
const ani = require('./ani-profile-pic.jpg');

const About: React.FC = () => {
  return (
    <div className="container">
      <h1 className="text-center">About Us</h1>
      <div className="row my-2">
        <div className="col-12 col-md-6">
          <TeamMember
            image={ethan}
            tagline="I like pizza 🍕"
            currentPosition="Co-Maker of FoodFeed"
            linkedinLink="https://www.linkedin.com/in/ethannaluz/"
            twitterLink="https://twitter.com/ethannaluz"
            githubLink="https://github.com/enaluz"
          />
        </div>
        <div className="col-12 col-md-6">
          <TeamMember
            image={ani}
            tagline="I like noodles 🍜"
            currentPosition="Co-Maker of FoodFeed"
            linkedinLink="https://www.linkedin.com/in/aniravichandran/"
            twitterLink="https://twitter.com/therealAniRavi"
            githubLink="https://github.com/aniravi24"
          />
        </div>
      </div>
    </div>
  );
};

interface TeamMemberProps {
  image: string;
  tagline: string;
  currentPosition: string;
  linkedinLink: string;
  githubLink: string;
  twitterLink: string;
}

const TeamMember = (props: TeamMemberProps) => {
  const styles = {
    profilePic: {
      maxWidth: '20rem',
      borderRadius: '100%',
      margin: '0 auto',
      display: 'block',
      overflow: 'hidden'
    },
    icon: {
      maxWidth: '2rem',
      margin: '0 0.5rem',
      display: 'inline-block'
    },
    info: {
      margin: '2rem 5rem'
    }
  };

  const {
    image,
    tagline,
    currentPosition,
    linkedinLink,
    githubLink,
    twitterLink
  } = props;

  return (
    <div className="py-3">
      <img
        src={image}
        alt="Team member"
        className="border"
        style={styles.profilePic}
      />
      <div className="text-center" style={styles.info}>
        <p>{tagline}</p>
        <p>{currentPosition}</p>
        <a href={linkedinLink}>
          <img src={linkedin} alt="Linkedin Icon" style={styles.icon} />
        </a>
        <a href={githubLink}>
          <img src={github} alt="Github Icon" style={styles.icon} />
        </a>
        <a href={twitterLink}>
          <img src={twitter} alt="Twitter Icon" style={styles.icon} />
        </a>
      </div>
    </div>
  );
};

export default About;
