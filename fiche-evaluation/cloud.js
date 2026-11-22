/* Connexion au site (Firebase Auth + Firestore). Chargé en module : si Firebase est injoignable, la fiche marche quand même en local. */
const B='https://www.gstatic.com/firebasejs/10.7.1/';
try{
  const [A,AU,FS]=await Promise.all([
    import(B+'firebase-app.js'),
    import(B+'firebase-auth.js'),
    import(B+'firebase-firestore.js')
  ]);
  const app=A.initializeApp({
    apiKey:"AIzaSyAv5azCx_NU0kgRflnFBetaqqWN7ahi8TQ",
    authDomain:"asmb-app.firebaseapp.com",
    projectId:"asmb-app",
    storageBucket:"asmb-app.firebasestorage.app",
    messagingSenderId:"786817375628",
    appId:"1:786817375628:web:3db013af1adab9e8ab8aa9"
  });
  try{
    const AC=await import(B+'firebase-app-check.js');
    AC.initializeAppCheck(app,{provider:new AC.ReCaptchaEnterpriseProvider("6Le30N8tAAAAAGUJks6zaN09Rbn8B6L-cQRC5Jwp"),isTokenAutoRefreshEnabled:true});
  }catch(e){}
  const auth=AU.getAuth(app);
  auth.languageCode='fr';
  let db;
  try{db=FS.initializeFirestore(app,{localCache:FS.persistentLocalCache({tabManager:FS.persistentMultipleTabManager()})});}
  catch(e){db=FS.getFirestore(app);}
  const col=uid=>FS.collection(db,'observateurs',uid,'matchs');
  window.Cloud={
    onAuth:cb=>AU.onAuthStateChanged(auth,cb),
    signIn:(e,p)=>AU.signInWithEmailAndPassword(auth,e,p).catch(err=>{
      if(err&&err.code==='auth/multi-factor-auth-required'){
        const r=AU.getMultiFactorResolver(auth,err);
        const h=r.hints.find(x=>x.factorId===AU.TotpMultiFactorGenerator.FACTOR_ID)||r.hints[0];
        throw {code:'mfa',finish:code=>r.resolveSignIn(AU.TotpMultiFactorGenerator.assertionForSignIn(h.uid,code))};
      }
      throw err;
    }),
    signUp:(e,p)=>AU.createUserWithEmailAndPassword(auth,e,p),
    reset:e=>AU.sendPasswordResetEmail(auth,e),
    signOut:()=>AU.signOut(auth),
    set:(uid,id,body)=>FS.setDoc(FS.doc(db,'observateurs',uid,'matchs',id),body),
    del:(uid,id)=>FS.deleteDoc(FS.doc(db,'observateurs',uid,'matchs',id)),
    listen:(uid,ok,ko)=>FS.onSnapshot(
      FS.query(col(uid),FS.orderBy('updatedAt','desc'),FS.limit(50)),
      snap=>ok(snap.docs.map(d=>({id:d.id,data:d.data()}))),
      ko
    )
  };
}catch(e){window.CloudFail=true;console.warn('cloud',e);}
window.dispatchEvent(new Event('cloud-ready'));
