// import React, { useState } from 'react';
// import { Link } from "react-router-dom";

// import './Join.css';

// export default function SignIn() {
//   const [name, setName] = useState('');
//   const [room, setRoom] = useState('');
//   return (
//     <div className="joinOuterContainer">
//       <div className="joinInnerContainer">
//         <h1 className="heading">Join</h1>
//         <div>
//           <input placeholder="Name" className="joinInput" type="text" onChange={(event) => setName(event.target.value)} />
//         </div>
//         <div>
//           <input placeholder="Room" className="joinInput mt-20" type="text" onChange={(event) => setRoom(event.target.value)} />
//         </div>
//         <Link onClick={e => (!name || !room) ? e.preventDefault() : null} to={`/chat?name=${name}&room=${room}`}>
//           <button className={'button mt-20'} type="submit">Sign In</button>
//         </Link>
//       </div>
//     </div>
//   );
// }


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, storage } from "../../firebase.js";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./Join.css";

export default function SignIn() {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

  const navigate = useNavigate();

const handleRegister = async (e) => {
  e.preventDefault();
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    let photoURL = "";

    if (profilePhoto) {
      const storageRef = ref(storage, `profilePhotos/${user.uid}`); // corrected backticks
      await uploadBytes(storageRef, profilePhoto);
      photoURL = await getDownloadURL(storageRef);
    }
    console.log(`Profile Photo URL: ${photoURL}`);
    await updateProfile(user, { displayName: name, photoURL });

    // Redirect to chat page with photoURL
    navigate(
      `/chat?name=${name}&room=${room}&photoURL=${encodeURIComponent(photoURL)}`
    );
  } catch (error) {
    console.error("Error registering user:", error);
  }
};


  return (
    <div className="joinOuterContainer">
      <div className="joinInnerContainer">
        <h1 className="heading">Join</h1>
        <form onSubmit={handleRegister}>
          <input
            placeholder="Name"
            className="joinInput"
            type="text"
            onChange={(event) => setName(event.target.value)}
          />
          <input
            placeholder="Email"
            className="joinInput mt-20"
            type="email"
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            placeholder="Password"
            className="joinInput mt-20"
            type="password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <input
            placeholder="Room"
            className="joinInput mt-20"
            type="text"
            onChange={(event) => setRoom(event.target.value)}
          />
          <input
            type="file"
            className="joinInput mt-20"
            onChange={(event) => setProfilePhoto(event.target.files[0])}
          />
          <button className={"button mt-20"} type="submit">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
