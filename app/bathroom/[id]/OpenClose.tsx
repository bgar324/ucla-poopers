interface OpenCloseProps {
  isOpen: boolean;
}

export default function OpenClose({ isOpen }: OpenCloseProps) {
  return (
    <p
      className={`font-rubik rounded-lg px-3 py-1 text-sm inline-block ${
        isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
      }`}
    >
      {isOpen ? "Open now" : "Closed"}
    </p>
  );
}
