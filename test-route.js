fetch('http://127.0.0.1:3000/api/auth/test', { redirect: 'manual' })
  .then(res => {
    console.log("Status:", res.status);
    console.log("Headers:", Array.from(res.headers.entries()));
  });
