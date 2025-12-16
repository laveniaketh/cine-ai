export async function GET() {
  return Response.json(
    { sucess: true, data: "Vapi generate route works!" },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  const {} = await request.json();
}
