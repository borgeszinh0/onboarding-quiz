"use client";
export default function Error({ error }: { error: Error }) {
  return <main id="error-screen" style={{color: 'red', padding: 20}}>ERROR: {error.message}</main>;
}
