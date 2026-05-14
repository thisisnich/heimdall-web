export default function TestPage() {
  console.log("[TestPage] Rendering");
  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Test Page</h1>
      <p>If you can see this, rendering works!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}
