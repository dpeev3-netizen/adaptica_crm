import ContactClient from "./ContactClient";

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <ContactClient id={params.id} />;
}
