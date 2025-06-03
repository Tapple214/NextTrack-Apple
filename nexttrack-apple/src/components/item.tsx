type ItemParams = {
  title: string;
};

export default function Item({ title }: ItemParams) {
  return (
    <div className="bg-secondary p-2">
      <p>{title}</p>
    </div>
  );
}
