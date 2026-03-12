type Props = {
  type: "error" | "success";
  message: string;
};

export default function Banner({ type, message }: Props) {
  return <div className={`banner ${type}`}>{message}</div>;
}
