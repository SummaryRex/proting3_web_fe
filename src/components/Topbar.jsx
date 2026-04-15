export default function Topbar({ title }) {
  return (
    <header className="flex items-center justify-between mb-5">
      <h1 className="text-lg font-bold text-white m-0">{title}</h1>
    </header>
  );
}
