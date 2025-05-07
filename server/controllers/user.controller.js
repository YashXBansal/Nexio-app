import User from "../models/User.model.js";
import FriendRequest from "../models/FriendRequest.model.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;

    const currentUser = req.user;
    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // excluding current user
        { _id: { $nin: currentUser.friends } }, // excluding friends
        { isOnboarded: true },
      ],
    });
    res.status(200).json({
      message: "Recommended users fetched successfully",
      recommendedUsers,
    });
  } catch (error) {
    console.error("Error fetching recommended users:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage"
      );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Friends fetched successfully",
      friends: user.friends,
    });
  } catch (error) {
    console.error("Error fetching friends:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;
    // prevent sending a friend request to yourself
    if (myId === recipientId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself." });
    }
    // Check if the recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }
    // Check if the recipient is already a friend
    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user." });
    }
    // Check if a friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "Friend request already sent or received.",
      });
    }
    // Create a new friend request
    const newRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });
    // Respond with the new friend request details
    res.status(201).json({
      message: "Friend request sent successfully",
      friendRequest: newRequest,
    });
  } catch (error) {
    console.error("Error sending friend request:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    // Check if the current user is the recipient of the request
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept this request" });
    }
    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each userd to the other's friends list
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });
    res.status(200).json({
      message: "Friend request accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting friend request:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingRequests = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic nativeLanguage learningLanguage"
    );
    const acceptedRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate(
      "recipient",
      "fullName profilePic nativeLanguage learningLanguage"
    );
    res.status(200).json({
      message: "Friend requests fetched successfully",
      incomingRequests,
      acceptedRequests,
    });
  } catch (error) {
    console.error("Error fetching friend requests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOutgoingFriendRequests(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic nativeLanguage learningLanguage"
    );
    res.status(200).json({
      message: "Outgoing friend requests fetched successfully",
      outgoingRequests,
    });
  } catch (error) {
    console.error("Error fetching outgoing friend requests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
