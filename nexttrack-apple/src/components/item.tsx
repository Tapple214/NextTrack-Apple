type ItemParams = {
  title: string;
};

export default function Item({ title }: ItemParams) {
  return (
    <div className="col-12 bg-secondary p-2 d-flex justify-content-between align-items-center">
      <div className="col-4">
        <p className="m-0">{title}</p>
      </div>

      <div className="col-8 d-flex justify-content-around">
        <i className="bi bi-link"></i>
        <i className="bi bi-play-circle-fill"></i>
      </div>
    </div>
  );
}
