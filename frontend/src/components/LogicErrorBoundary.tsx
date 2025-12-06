export const LogicErrorBoundary = ({
  errorMessage = "系统错误",
}: {
  errorMessage?: string;
}) => {
  return (
    <div style={{ padding: 20, textAlign: "center", color: "red" }}>
      <h2>{errorMessage}</h2>
      <p>系统遇到了错误，请联系开发者。</p>
    </div>
  );
};
