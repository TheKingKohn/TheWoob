import { useState } from "react";
import { prisma } from "../../lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/session";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  const user = (session as any).user;
  if (!user || user.role !== "admin") {
    return { redirect: { destination: "/", permanent: false } };
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  return { props: { users } };
};

export default function VerifySellerAdmin({ users }: any) {
  const [userList, setUserList] = useState(users);
  const toggleVerified = async (id: string, current: boolean) => {
    const res = await fetch("/api/admin/verify-seller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, verified: !current }),
    });
    if (res.ok) {
      setUserList((prev: any) =>
        prev.map((u: any) =>
          u.id === id ? { ...u, verifiedSeller: !current } : u
        )
      );
    }
  };
  return (
    <div className="woob-container py-8">
      <h1 className="text-heading-3 mb-6">Verify Sellers</h1>
      <table className="w-full text-left border">
        <thead>
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Verified Seller</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {userList.map((u: any) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name || "-"}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.verifiedSeller ? "✅" : "❌"}</td>
              <td className="p-2">
                <button
                  className={`btn btn-xs ${u.verifiedSeller ? "btn-danger" : "btn-success"}`}
                  onClick={() => toggleVerified(u.id, u.verifiedSeller)}
                >
                  {u.verifiedSeller ? "Unverify" : "Verify"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
