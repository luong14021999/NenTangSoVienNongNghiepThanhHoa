import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { labInfo } from "@/lib/modules/m2/accreditation";

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Cấu hình hệ thống"
        description="Tham số phòng thí nghiệm, người dùng, phân quyền và tích hợp"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phòng thí nghiệm</CardTitle>
              <CardDescription>
                Hiển thị trên phiếu nhận mẫu và phiếu kết quả
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org">Cơ quan chủ quản</Label>
                <Input id="org" defaultValue="Viện Nông nghiệp tỉnh Thanh Hóa" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lab">Tên phòng thí nghiệm</Label>
                <Input
                  id="lab"
                  defaultValue="Phòng phân tích Đất, nước, phân bón và môi trường"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iso">Số chứng nhận ISO/IEC 17025</Label>
                <Input id="iso" defaultValue={labInfo.vilasCode} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manager">Người quản lý PTN</Label>
                <Input id="manager" defaultValue={labInfo.manager} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr">Địa chỉ</Label>
                <Input id="addr" defaultValue={labInfo.address} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Điện thoại</Label>
                  <Input id="phone" defaultValue={labInfo.phone} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={labInfo.email} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="web">Website</Label>
                <Input id="web" defaultValue={labInfo.website} />
              </div>
              <div className="flex justify-end">
                <Button>Lưu thay đổi</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Định dạng mã mẫu</CardTitle>
              <CardDescription>
                Tự động sinh mã khi tạo phiếu tiếp nhận – theo quy định Viện
                (spec mục I.1)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pattern">Mẫu mã</Label>
                <Input
                  id="pattern"
                  defaultValue="{YY}{MM}{DD}-{phieuSeq:2}/{sampleSeq}"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Ví dụ: <span className="font-mono">260626-12/3</span> →
                  ngày 26/06/26, phiếu thứ 12 trong tháng, mẫu thứ 3 của phiếu
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phieuSeq">Số phiếu kế tiếp (tháng này)</Label>
                  <Input id="phieuSeq" type="number" defaultValue={13} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sampleSeq">Số mẫu kế tiếp trong phiếu</Label>
                  <Input id="sampleSeq" type="number" defaultValue={1} />
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1">
                <div className="font-semibold uppercase text-muted-foreground">
                  Giải thích token
                </div>
                <div>
                  <span className="font-mono">YY</span> · 2 số cuối của năm (26)
                </div>
                <div>
                  <span className="font-mono">MM</span> · tháng (06)
                </div>
                <div>
                  <span className="font-mono">DD</span> · ngày trong tháng (26)
                </div>
                <div>
                  <span className="font-mono">phieuSeq:2</span> · số thứ tự
                  phiếu trong tháng (XX)
                </div>
                <div>
                  <span className="font-mono">sampleSeq</span> · số thứ tự mẫu
                  trong phiếu (Y)
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Lưu</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
