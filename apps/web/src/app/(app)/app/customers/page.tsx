import { CustomersClient } from "@/features/customers/customers-client";
import { getCustomers } from "@/lib/data";
export default async function CustomersPage() { return <CustomersClient customers={await getCustomers()} />; }
