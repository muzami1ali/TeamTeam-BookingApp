// SOCIETY CONTROLLER
const prisma = require('../../prisma/prisma.js');
const auth = require('../utils/jwt_auth.js');

/**
 * Sign up a new society
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @return {Response} The response object
 */
async function signup(req, res) {
  try {
    const decoded = await auth.authenticate(req);


    // Check that the request body is not empty and contains the correct
    // properties
    if (
      !req.body.societyName ||
      !req.body.description ||
      !req.body.email
    ) {
      res.status(400).send({error: 'Missing Society Details'});
      return;
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });


    if (!user) {
      return res.status(409).send({token: null, message: 'User Not Found'});
    }


    // Check if the society already exists
    let society = await prisma.society.findUnique({
      where: {
        name: req.body.societyName,
      },
    });


    if (society) {
      return res
          .status(409)
          .send({token: null, message: 'Society already exists'});
    }


    society = await prisma.society.create({
      data: {
        name: req.body.societyName,
        description: req.body.description,
        email: req.body.email,
        category: req.body.category ? req.body.category : 'Other',
      },
    });


    listSocietyLinks = await prisma.societyLinks.create({

      data: {
        societyId: society.id,
        banner: req.body.banner ? req.body.banner : null,
        logo: req.body.logo ? req.body.logo : null,
        website: req.body.website ? req.body.website : null,
        facebook: req.body.facebook ? req.body.facebook : null,
        instagram: req.body.instagram ? req.body.instagram : null,
        twitter: req.body.twitter ? req.body.twitter : null,
      },
    });


    committee = await prisma.committee.create({
      data: {
        userId: user.id,
        societyId: society.id,
        role: 'President',
        isPresident: true,
      },
    });


    res.status(200).send({society, committee, listSocietyLinks});
  } catch (err) {
    console.log(err);
    res.status(401).send({token: null, error: 'Unauthorized'});
  }
}

/**
 * Get a list of all societies
 * @param {Request} req The request object
 * @param {Response} res The response object

 */
async function getSocieties(req, res) {
  // Return a list of all societies, their names, number of members and an
  // abbreviated description
  const societies = await prisma.society.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      // Calculate the number of members in the society
      members: {
        select: {
          userId: true,
        },
      },
      links: true,
    },
    where: {
      isArchived: false,
    },
  });

  // Only send the number of members
  societies.forEach((society) => {
    society.members = society.members.length;
    if (society.description.length > 50) {
      society.description = society.description.substring(0, 50) + '...';
    }
  });

  res.status(200).send(societies);
}

/**
 * Get a society by id
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @return {Response} The response object
 */
async function getSocietyById(req, res) {
  // we should check if the user that made the request is a committee member of
  // the society
  try {
    let committee = null;

    // If the request header authorization is not empty, the user is logged in
    if (req.headers.authorization) {
      // Get the decoded token
      const userId = (await auth.authenticate(req)).id;

      // Check if user is a committee member of the society
      committee = await prisma.committee.findMany({
        where: {
          userId: userId,
          societyId: req.body.societyId,
        },
        select: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    }

    // Get the society
    const society = await prisma.society.findUnique({
      where: {
        id: parseInt(req.body.societyId),
      },
      include: {
        members: true,
        links: true,
        events: {
          include: {
            society: true,
          },
        },
      },
    });

    // Only send the number of members
    society.members = society.members.length;

    if (!committee) {
      res.status(200).send({
        society: society,
      });
      return;
    }

    // Add the committee members to the society object
    const committeeMembers = await prisma.committee.findMany({
      where: {
        societyId: req.body.societyId,
      },
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Add the committee members to the society object
    society.committee = committeeMembers;

    res.status(200).send({
      society: society,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Delete a society
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @return {Response} The response object
 */
async function deleteSociety(req, res) {
  try {
    const decoded = await auth.authenticate(req);

    const userId = decoded.id;
    const isAdmin = decoded.admin;
    const commitee = await prisma.committee.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
      },
    });
    console.log(decoded);
    if (!commitee.isPresident && !isAdmin) {
      res.status(401).send({message: 'Unauthorized'});
      return;
    }
    await prisma.society.update({
      where: {id: req.body.societyId},
      data: {isArchived: true},
    });
    res.status(200).send({message: 'Society Updated'});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Update a society
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @return {Response} The response object
 */
async function updateSociety(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    // Check if user is a committee member of the society
    const committee = await prisma.committee.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
      },
    });
    console.log(committee);

    if (committee.length === 0) {
      res.status(401).send({message: 'Unauthorized'});
      return;
    }

    // Get the society
    const society = await prisma.society.findUnique({
      where: {
        id: req.body.societyId,
      },
    });

    if (society.length === 0) {
      res.status(404).send({message: 'Society Not Found'});
      return;
    }

    // Update the society
    // Only update the fields that are not empty in the request body
    await prisma.society.update({
      where: {
        id: req.body.societyId,
      },
      data: {
        name: req.body.name ? req.body.name : society.name,
        category: req.body.category ? req.body.category : society.category,
        email: req.body.email ? req.body.email : society.email,
        description: req.body.description ?
        req.body.description :
        society.description,
      },
    });

    // get the society links
    const societyLinks = await prisma.societyLinks.findUnique({
      where: {
        societyId: req.body.societyId,
      },
    });

    // Update the society links if they exist in the request body
    console.log(req.body.links);
    if (req.body.links) {
      console.log('here');
      const updateSocietyLinks = await prisma.societyLinks.update({
        where: {
          societyId: req.body.societyId,
        },
        data: {
          website: req.body.links.website ?
            req.body.links.website :
            societyLinks.website,
          instagram: req.body.links.instagram ?
            req.body.links.instagram :
            societyLinks.instagram,
          twitter: req.body.links.twitter ?
            req.body.links.twitter :
            societyLinks.twitter,
          facebook: req.body.links.facebook?
            req.body.links.facebook:
            societyLinks.facebook,
          logo: req.body.links.logo ? req.body.links.logo : societyLinks.logo,
          banner: req.body.links.banner?
            req.body.links.banner:
            societyLinks.banner,
        },
      });
      console.log(updateSocietyLinks);
    }

    res.status(200).send({message: 'Society Updated'});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Add a committee member to a society
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @return {Response} The response object
 */
async function addCommitteeMember(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    console.log(userId);

    // Check if user is a committee member of the society
    const committee = await prisma.committee.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
      },
      select: {
        isPresident: true,
      },
    });

    if (committee.length === 0) {
      res.status(401).send({message: 'User not part of committee'});
      return;
    }
    console.log(committee[0].isPresident);

    if (committee[0].isPresident === false) {
      res.status(400).send({message:
        'Only the president is able to update the committee'});

      return;
    }

    // Get the user from the email
    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      res.status(404).send({message: 'User Not Found'});
      return;
    }

    // Check if the user is already a committee member
    const isCommitteeMember = await prisma.committee.findMany({
      where: {
        userId: user.id,
        societyId: req.body.societyId,
      },
    });

    if (isCommitteeMember.length > 0) {
      res.status(400).send({message: 'User is already a committee member'});
      return;
    }

    // Add the user to the committee
    await prisma.committee.create({
      data: {
        userId: user.id,
        societyId: req.body.societyId,
        isPresident: false,
        role: req.body.role,
      },
    });

    res
        .status(200)
        .send({message: 'User added to committee', userId: user.id});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Remove a committee member from a society
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @return {Response} The response object
 */
async function removeCommitteeMember(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    // Check if user is a committee member of the society
    const committee = await prisma.committee.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
      },
      select: {
        isPresident: true,
      },
    });

    if (committee.length === 0) {
      res.status(401).send({message: 'Unauthorized'});

      return;
    }

    if (committee[0].isPresident === false) {
      res.status(400).send({message: 'User must be a President'});

      return;
    }

    // Check if the user is a committee member
    const isCommitteeMember = await prisma.committee.findMany({
      where: {
        userId: req.body.userId,
        societyId: req.body.societyId,
      },
    });

    if (isCommitteeMember == 0) {
      res.status(400).send({message: 'User is not a committee member'});

      return;
    }

    if (isCommitteeMember[0].isPresident === true) {
      res.status(400).send({message: 'Cannot remove the president'});

      return;
    }

    // Remove the user from the committee
    await prisma.committee.delete({
      where: {
        userId_societyId: {
          userId: req.body.userId,
          societyId: req.body.societyId,
        },
      },
    });

    res.status(200).send({message: 'User removed from committee'});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Update a committee member's role
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @return {Response} The response object
 */
async function updateCommitteeMember(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    // Check if user is a committee member of the society
    const committee = await prisma.committee.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
      },
      select: {
        isPresident: true,
      },
    });

    if (committee.length === 0) {
      res.status(401).send({message: 'Unauthorized'});
      return;
    }

    // Check if the user is a committee member
    const isCommitteeMember = await prisma.committee.findMany({
      where: {
        userId: req.body.userId,
        societyId: req.body.societyId,
      },
    });
    console.log(isCommitteeMember);

    if (isCommitteeMember.length == 0) {
      res.status(400).send({message: 'User is not a committee member'});
      return;
    }

    // Update the user's role in the committee
    await prisma.committee.update({
      where: {
        userId_societyId: {
          userId: req.body.userId,
          societyId: req.body.societyId,
        },
      },
      data: {
        role: req.body.role,
        isPresident: req.body.isPresident,
      },
    });

    // Check that there aren't multiple presidents
    const presidents = await prisma.committee.findMany({
      where: {
        societyId: req.body.societyId,
        isPresident: true,
      },
    });

    // If there are multiple presidents, set the first one to false
    if (presidents.length > 1) {
      await prisma.committee.update({
        where: {
          userId: userId,
          societyId: req.body.societyId,
        },
        data: {
          isPresident: false,
        },
      });
    }

    res.status(200).send({message: 'User updated in committee'});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Get all committee members of a society
 * @param {Request} req The request object
 * @param {Response} res The response object
 */
async function getCommitteeMembers(req, res) {
  try {
    if (!req.body.societyId) {
      res.status(400).send({message: 'Missing societyId'});
      return;
    }

    const committee = await prisma.committee.findMany({
      where: {
        societyId: req.body.societyId,
      },
      select: {
        userId: true,
        role: true,
      },
    });

    if (committee.length === 0) {
      res.status(404).send({message: 'No committee members found'});
      return;
    }

    for (let i = 0; i < committee.length; i++) {
      const user = await prisma.user.findUnique({
        where: {
          id: committee[i].userId,
        },
        select: {
          email: true,
        },
      });
      committee[i].email = user.email;
    }

    res
        .status(200)
        .send({message: 'Committee members found', committee: committee});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * User can follow a society
 * @param {Request} req The request object
 * @param {Response} res The response object
 */
async function followSociety(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    if (!req.body.societyId) {
      res.status(400).send({message: 'Missing societyId'});
      return;
    }

    const member = await prisma.members.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
      },
    });

    if (member.length > 0) {
      // res.status(400).send({message: 'User is already a member'});
      if (member[0].isArchived === true) {
        await prisma.members.update({
          where: {
            userId_societyId: {
              userId: userId,
              societyId: req.body.societyId,
            },
          },
          data: {
            isArchived: false,
          },
        });
        res.status(200).send({message: 'User is now a member'});
        return;
      } else {
        res.status(400).send({message: 'User is already a member'});
        return;
      }
    }

    await prisma.members.create({
      data: {
        userId: userId,
        societyId: req.body.societyId,
      },
    });

    res.status(200).send({message: 'User is now a member'});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * User can unfollow a society
 * @param {Request} req The request object
 * @param {Response} res The response object
 */
async function unFollowSociety(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    if (!req.body.societyId) {
      res.status(400).send({message: 'Missing societyId'});
      return;
    }

    const member = await prisma.members.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
      },
    });

    if (member.length === 0) {
      res.status(400).send({message: 'User is not a member'});
      return;
    }

    if (member[0].isArchived === true) {
      res.status(400).send({message: 'User is already not a member'});
      return;
    }

    await prisma.members.update({
      where: {
        userId_societyId: {
          userId: userId,
          societyId: req.body.societyId,
        },
      },
      data: {
        isArchived: true,
      },
    });

    res.status(200).send({message: 'User is no longer a member'});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Checks if user isa memebr a society
 * @param {Request} req The request object
 *  @param {Response} res The response object
 */
async function checkUserIsMember(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    if (!req.body.societyId) {
      res.status(400).send({message: 'Missing societyId'});
      return;
    }

    const member = await prisma.members.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
        isArchived: false,
      },
    });

    if (member.length === 0) {
      res.status(400).send({message: 'User is not a member'});
      return;
    }

    res.status(200).send({message: 'User is a member'});
  } catch (err) {
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Gets all members of a society
 * Checks if user requesting this data is a committee member
 * @param {Request} req The request object
 * @param {Response} res The response object
 */
async function getMembers(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    if (!req.body.societyId) {
      res.status(400).send({message: 'Missing societyId'});
      return;
    }

    const commitee = await prisma.committee.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
      },
    });

    if (commitee.length === 0) {
      res.status(400).send({message: 'User is not a committee member'});
      return;
    }

    const members = await prisma.members.findMany({
      where: {
        societyId: req.body.societyId,
        isArchived: false,
      },
      select: {
        userId: true,
      },
    });

    if (members.length === 0) {
      res.status(404).send({message: 'No members found'});
      return;
    }

    const userIds = members.map((member) => member.userId);

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.status(200).send({message: 'Members found', members: users});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * User can see a list of societies they follow
 * @param {Request} req The request object
 * @param {Response} res The response object
 */
async function getListOfFollowedSocieties(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    const societies = await prisma.members.findMany({
      where: {
        userId: userId,
        isArchived: false,
      },
      select: {
        societyId: true,
      },
    });

    if (societies.length === 0) {
      res.status(404).send({message: 'No societies found'});
      return;
    }

    res.status(200).send({message: 'Societies found', societies: societies});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Checks if user is a committee member
 * @param {Request} req The request object
 * @param {Response} res The response object
 */
async function checkIfUserIsCommitteeMember(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    if (!req.body.eventId) {
      res.status(400).send({message: 'Missing eventId'});
      return;
    }

    const event = await prisma.event.findUnique({
      where: {
        id: req.body.eventId,
      },
      select: {
        societyId: true,
      },
    });

    if (!event) {
      res.status(404).send({message: 'Event not found'});
      return;
    }

    const committee = await prisma.committee.findMany({
      where: {
        userId: userId,
        societyId: event.societyId,
      },
    });

    if (committee.length === 0) {
      res.status(200).send({isCommitteeMember: false});
      return;
    }

    res.status(200).send({isCommitteeMember: true});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

/**
 * Checks if user is president of a society
 * @param {Request} req The request object
 * @param {Response} res The response object
 */
async function checkIfUserIsPresident(req, res) {
  try {
    // Authenticate the user
    const userId = (await auth.authenticate(req)).id;

    if (!req.body.societyId) {
      res.status(400).send({message: 'Missing societyId'});
      return;
    }

    const president = await prisma.committee.findMany({
      where: {
        userId: userId,
        societyId: req.body.societyId,
        isPresident: true,
      },
    });

    if (president.length === 0) {
      res.status(200).send({isPresident: false});
      return;
    }

    res.status(200).send({isPresident: true});
  } catch (err) {
    console.log(err);
    res.status(500).send({message: 'Internal Server Error'});
  }
}

module.exports = {
  signup,
  getSocieties,
  getSocietyById,
  updateSociety,
  deleteSociety,
  addCommitteeMember,
  removeCommitteeMember,
  updateCommitteeMember,
  getCommitteeMembers,
  followSociety,
  unFollowSociety,
  checkUserIsMember,
  getMembers,
  getListOfFollowedSocieties,
  checkIfUserIsCommitteeMember,
  checkIfUserIsPresident,
};
